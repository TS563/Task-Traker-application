import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '../../../../../lib/mongodb';
import Task from '../../../../../Models/Task';
import mongoose from 'mongoose';

// GET a single task
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Handle params - it might be a Promise in Next.js 16
    const resolvedParams = params instanceof Promise ? await params : params;
    const taskId = resolvedParams?.id;
    
    // Fallback: Extract ID from URL if params.id is undefined
    let finalTaskId = taskId;
    if (!finalTaskId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      finalTaskId = pathParts[pathParts.length - 1];
    }
    
    // Validate ObjectId format
    if (!finalTaskId || !mongoose.Types.ObjectId.isValid(finalTaskId)) {
      console.error('Invalid task ID:', finalTaskId, 'Original params:', resolvedParams);
      return NextResponse.json(
        { error: 'Invalid task ID', details: `Task ID: ${finalTaskId}` },
        { status: 400 }
      );
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(finalTaskId),
      userId: session.user.id,
    });

    if (!task) {
      console.error('Task not found:', { taskId: finalTaskId, userId: session.user.id });
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Convert task to plain object with string ID
    const taskWithStringId = {
      ...task.toObject(),
      _id: task._id.toString(),
    };

    return NextResponse.json({ task: taskWithStringId }, { status: 200 });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch task',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// UPDATE a task
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, dueDate, priority, status } = await request.json();

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Handle params - it might be a Promise in Next.js 16
    const resolvedParams = params instanceof Promise ? await params : params;
    const taskId = resolvedParams?.id;
    
    // Fallback: Extract ID from URL if params.id is undefined
    let finalTaskId = taskId;
    if (!finalTaskId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      finalTaskId = pathParts[pathParts.length - 1];
    }
    
    // Validate ObjectId format
    if (!finalTaskId || !mongoose.Types.ObjectId.isValid(finalTaskId)) {
      console.error('Invalid task ID:', finalTaskId, 'Original params:', resolvedParams);
      return NextResponse.json(
        { error: 'Invalid task ID', details: `Task ID: ${finalTaskId}` },
        { status: 400 }
      );
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(finalTaskId),
        userId: session.user.id,
      },
      {
        title: title.trim(),
        description: description?.trim() || '',
        dueDate: dueDate || null,
        priority: priority || 'medium',
        status: status || 'To Do',
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Convert task to plain object with string ID
    const taskWithStringId = {
      ...task.toObject(),
      _id: task._id.toString(),
    };

    return NextResponse.json(
      { message: 'Task updated successfully', task: taskWithStringId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE a task
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Handle params - it might be a Promise in Next.js 16
    const resolvedParams = params instanceof Promise ? await params : params;
    const taskId = resolvedParams?.id;
    
    // Fallback: Extract ID from URL if params.id is undefined
    let finalTaskId = taskId;
    if (!finalTaskId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      finalTaskId = pathParts[pathParts.length - 1];
    }
    
    // Validate ObjectId format
    if (!finalTaskId || !mongoose.Types.ObjectId.isValid(finalTaskId)) {
      console.error('Invalid task ID:', finalTaskId, 'Original params:', resolvedParams);
      return NextResponse.json(
        { error: 'Invalid task ID', details: `Task ID: ${finalTaskId}` },
        { status: 400 }
      );
    }

    const task = await Task.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(finalTaskId),
      userId: session.user.id,
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

