// src/app/api/tasks/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../../lib/authMiddleware'; 
import { TaskPriority, TaskStatus } from '@prisma/client';

// Define the required role IDs for updates/deletions that are generally restricted to managers
const REQUIRED_MANAGER_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID', 
  'PROJECT_MANAGER_ROLE_ID'
];

// =========================================================
// PUT Handler: Update Task Details (UPDATE)
// =========================================================

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHENTICATION: Allow all authenticated users to hit this endpoint
  const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Get user info from the JWT payload
  const requestingUserId = authResult.user.userId;
  // Check if the user is a manager (Admin, HR, or Project Manager)
  const isManager = REQUIRED_MANAGER_ROLES.includes(authResult.user.roleId);

  try {
    const taskId = params.id;
    const body = await request.json();
    
    const { 
      title, 
      description, 
      priority, 
      status, 
      dueDate,
      assignedToUserId
    } = body;
    
    if (!taskId) {
      return NextResponse.json({ message: 'Missing task ID in the URL.' }, { status: 400 });
    }
    
    // 2. Prepare the data payload for partial updates
    const updateData: Record<string, any> = {};
    let isStatusUpdateOnly = true;

    // --- Role-Based Permission Logic ---
    if (isManager) {
      // MANAGERS can update all fields:
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      
      if (priority !== undefined && Object.keys(TaskPriority).includes(priority)) {
          updateData.priority = priority;
          isStatusUpdateOnly = false;
      }
      
      if (dueDate !== undefined) {
          updateData.dueDate = dueDate ? new Date(dueDate) : null;
          isStatusUpdateOnly = false;
      }
      
      // Manager changing assignee
      if (assignedToUserId !== undefined) {
          const assigneeExists = await prisma.user.findUnique({
              where: { id: assignedToUserId, isActive: true },
              select: { id: true },
          });
          if (!assigneeExists) {
              return NextResponse.json({ message: 'New assigned user ID is invalid or inactive.' }, { status: 404 });
          }
          updateData.assignedToUserId = assignedToUserId;
          isStatusUpdateOnly = false;
      }

    } else {
      // STANDARD EMPLOYEES can ONLY update the task STATUS
      // Check if the employee is attempting to change non-status fields
      if (Object.keys(body).some(key => key !== 'status')) {
         return NextResponse.json(
            { message: 'Employees can only update the task status.' }, 
            { status: 403 } // Forbidden
          );
      }
    }

    // 3. Process Status Update (Allowed for all, but only if the user is the assignee or manager)
    if (status !== undefined) {
      if (Object.keys(TaskStatus).includes(status)) {
        updateData.status = status;
      } else {
        return NextResponse.json({ message: 'Invalid task status provided.' }, { status: 400 });
      }
    }
    
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    // 4. Final Security Check: If it's *not* a manager, ensure the user is the assignee
    if (!isManager && isStatusUpdateOnly) {
        const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assignedToUserId: true } });
        
        if (!task || task.assignedToUserId !== requestingUserId) {
            return NextResponse.json(
                { message: 'Forbidden: You can only update the status of tasks assigned to you.' }, 
                { status: 403 }
            );
        }
    }

    // 5. Perform the update operation
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedToUserId: true,
        updatedAt: true,
      },
    });

    // 6. Return success response
    return NextResponse.json(
      { message: 'Task updated successfully.', task: updatedTask },
      { status: 200 } // OK
    );

  } catch (error) {
    // Handle Prisma error for "record to update not found" (P2025)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json({ message: 'Task not found.' }, { status: 404 });
    }
    
    console.error('Task update error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during task update.' },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE Handler: Delete Task (DELETE)
// =========================================================

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  // 1. RUN AUTHORIZATION: Only managers can delete a task
  const authResult = await authenticate(request, REQUIRED_MANAGER_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const taskId = params.id;
    
    if (!taskId) {
      return NextResponse.json(
        { message: 'Missing task ID in the URL.' },
        { status: 400 } // Bad Request
      );
    }

    // 2. Perform the delete operation in the database
    const deletedTask = await prisma.task.delete({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        projectId: true,
      },
    });

    // 3. Return a success response
    return NextResponse.json(
      { 
        message: `Task "${deletedTask.title}" deleted successfully.`, 
        id: deletedTask.id 
      },
      { status: 200 } // OK
    );

  } catch (error) {
    // Handle Prisma error for "record to delete not found" (P2025)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
       return NextResponse.json(
        { message: 'Task not found.' },
        { status: 404 }
      );
    }
    
    console.error('Task deletion error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during task deletion.' },
      { status: 500 }
    );
  }
}