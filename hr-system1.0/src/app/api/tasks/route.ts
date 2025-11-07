// src/app/api/tasks/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '../../lib/prisma';
import { authenticate, ACCESS_ROLES } from '../../lib/authMiddleware'; 
import { TaskPriority, TaskStatus } from '@prisma/client'; // Import Task enums

// !! IMPORTANT: Replace these placeholders with the actual MongoDB ObjectIds 
// for the roles allowed to create tasks (e.g., Admin, HR Manager, Project Manager).
const REQUIRED_TASK_CREATION_ROLES = [
  'ADMIN_ROLE_ID', 
  'HR_MANAGER_ROLE_ID',
  'PROJECT_MANAGER_ROLE_ID' 
];

// =========================================================
// POST Handler: Create New Task (CREATE)
// =========================================================

export async function POST(request: NextRequest) {
  // 1. RUN AUTHORIZATION: Only authorized roles can create a task
  const authResult = await authenticate(request, REQUIRED_TASK_CREATION_ROLES);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the 401/403 response from middleware
  }
  
  try {
    const body = await request.json();
    const { 
      projectId, 
      assignedToUserId, 
      title, 
      description, 
      priority, 
      dueDate 
    } = body;

    // --- Basic Input Validation ---
    if (!projectId || !assignedToUserId || !title) {
      return NextResponse.json(
        { message: 'Missing required fields: projectId, assignedToUserId, and title are required.' },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. Validate Project and Assignee existence using a transaction
    const [project, assignee] = await prisma.$transaction([
        prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: assignedToUserId, isActive: true }, select: { id: true } }),
    ]);
    
    if (!project) {
        return NextResponse.json(
            { message: 'The specified Project ID is invalid or does not exist.' },
            { status: 404 }
        );
    }
    
    if (!assignee) {
        return NextResponse.json(
            { message: 'The specified assigned user ID is invalid or the user is inactive.' },
            { status: 404 }
        );
    }

    // 3. Create the new task record
    const newTask = await prisma.task.create({
      data: {
        projectId,
        assignedToUserId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        // Ensure priority is valid or default to Medium
        priority: (priority as TaskPriority) || TaskPriority.Medium, 
        // Default status is always To_Do for a new task
        status: TaskStatus.To_Do, 
      },
      // 4. Select fields to return
      select: {
        id: true,
        title: true,
        projectId: true,
        assignedToUserId: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });

    // 5. Return a success response
    return NextResponse.json(
      { 
        message: 'Task created and assigned successfully.', 
        task: newTask 
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred during task creation.' },
      { status: 500 } // Internal Server Error
    );
  }
}

// =========================================================
// GET Handler: Fetch Tasks (READ)
// =========================================================

export async function GET(request: NextRequest) {
  // 1. RUN AUTHORIZATION: All authenticated users can read tasks
  const authResult = await authenticate(request, ACCESS_ROLES.ALL_AUTHENTICATED);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the 401/403 response from middleware
  }

  // Get user info from the JWT payload
  const requestingUserId = authResult.user.userId;
  const isManager = ['ADMIN_ROLE_ID', 'HR_MANAGER_ROLE_ID', 'PROJECT_MANAGER_ROLE_ID'].includes(authResult.user.roleId);

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const filterUserId = searchParams.get('assignedToUserId');

    // 2. Define the WHERE clause for filtering
    const where: any = {};
    let isFilteredByProject = false;

    if (projectId) {
      where.projectId = projectId;
      isFilteredByProject = true;
    }
    
    if (filterUserId) {
      where.assignedToUserId = filterUserId;
    }

    // 3. Security/Authorization Logic: Restrict views for standard employees
    if (!isManager) {
      // Employees can ONLY see tasks assigned to them. 
      // Overwrite any user-provided filterUserId to ensure security.
      if (filterUserId && filterUserId !== requestingUserId) {
         return NextResponse.json(
            { message: 'Forbidden: Employees can only view tasks assigned to themselves.' },
            { status: 403 }
         );
      }
      
      // Enforce the filter: Only show tasks assigned to the requesting user
      where.assignedToUserId = requestingUserId;
    }

    // 4. Fetch the tasks from the database
    const tasks = await prisma.task.findMany({
      where: where,
      orderBy: [
        { dueDate: 'asc' }, // Order by due date first
        { priority: 'desc' }, // Then by priority
      ],
      // 5. Select all relevant task details and include relation data
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        priority: true,
        status: true,
        // Include assignee's name
        assignedTo: {
          select: { fullName: true, email: true },
        },
        // Include project name if not already filtering by project
        project: isFilteredByProject ? undefined : {
            select: { name: true, managerId: true },
        },
        createdAt: true,
      },
    });

    // 6. Return the task list
    return NextResponse.json(
      { tasks: tasks },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred while fetching task data.' },
      { status: 500 } // Internal Server Error
    );
  }
}