// src/components/leave-request-form.tsx

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker'; // Import DateRange type

import { cn } from '@/lib/utils';
import {
    LeaveRequestFormValues,
    LeaveRequestSchema,
} from '@/lib/schemas'; 

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// --- DUMMY DATA (Replace with actual data fetching later) ---
const mockLeaveTypes = [
    { id: '1', name: 'Annual Vacation' },
    { id: '2', name: 'Sick Leave' },
    { id: '3', name: 'Personal Day' },
];
// -----------------------------------------------------------


export function LeaveRequestForm() {
    const form = useForm<LeaveRequestFormValues>({
        resolver: zodResolver(LeaveRequestSchema),
        defaultValues: {
            typeId: '',
            dateRange: {
                // Initialize as null to match the Zod schema's .nullable() refinement
                from: null, 
                to: null,
            },
            reason: '',
        },
        mode: 'onChange',
    });

    async function onSubmit(data: LeaveRequestFormValues) {
        // --- FIX 1: Add Non-Null Check/Assertion before using Date methods ---
        // The Zod refinement guarantees they are present if validation passed.
        if (!data.dateRange.from || !data.dateRange.to) {
            // Should be unreachable if Zod validation is correct, but added for safety
            toast.error('Validation Error', { description: 'Date range is incomplete.' });
            return;
        }

        try {
            // 1. Prepare data for API
            console.log('Submitting Leave Request:', {
                typeId: data.typeId,
                // Now TypeScript knows these are Date objects due to the check/refinement
                startDate: data.dateRange.from.toISOString(), 
                endDate: data.dateRange.to.toISOString(), 
                reason: data.reason,
            });

            // 2. Mock success response
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            toast.success('Request Submitted', {
                description: `Your ${mockLeaveTypes.find(t => t.id === data.typeId)?.name} request has been submitted for approval.`,
            });

            // 3. Reset the form on successful submission
            form.reset();

        } catch (error) {
            toast.error('Submission Failed', {
                description: 'Could not submit leave request. Please try again.',
            });
            console.error(error);
        }
    }

    // --- Helper function to convert null|Date to undefined|Date for Calendar props ---
    const getCalendarValue = (value: Date | null | undefined): Date | undefined => {
        if (value === null) return undefined;
        return value;
    }

    // --- Helper to convert form state (Date | null) to Calendar state (Date | undefined) ---
    const calendarSelectedValue: DateRange = {
        from: getCalendarValue(form.watch('dateRange.from')),
        to: getCalendarValue(form.watch('dateRange.to')),
    };
    // -------------------------------------------------------------------------------------

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle>Submit Leave Request</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* 1. Leave Type Selection */}
                        <FormField
                            control={form.control}
                            name="typeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a type of leave" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mockLeaveTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 2. Date Range Picker (Uses Popover and Calendar) */}
                        <FormField
                            control={form.control}
                            name="dateRange"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start & End Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    id="date"
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !field.value.from && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {/* FIX 2: Use getCalendarValue for display logic */}
                                                    {field.value.from ? (
                                                        field.value.to ? (
                                                            <>
                                                                {format(field.value.from, 'LLL dd, y')} -{' '}
                                                                {format(field.value.to, 'LLL dd, y')}
                                                            </>
                                                        ) : (
                                                            format(field.value.from, 'LLL dd, y')
                                                        )
                                                    ) : (
                                                        <span>Pick a date range</span>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                // FIX 3: Pass a Date | undefined value to Calendar props
                                                defaultMonth={getCalendarValue(field.value.from) || new Date()} 
                                                selected={calendarSelectedValue} // Use the converted value
                                                onSelect={(value) => {
                                                    // Calendar returns Date | undefined, convert to Date | null for form
                                                    field.onChange({
                                                        from: value?.from ?? null,
                                                        to: value?.to ?? null,
                                                    });
                                                }}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Select the first and last day of your requested leave.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 3. Reason Textarea */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Leave</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., Taking a trip to visit family..."
                                            className="resize-none"
                                            rows={5}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}