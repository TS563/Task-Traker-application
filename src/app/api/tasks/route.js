import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '../../../../lib/mongodb';
import Task from '../../../../Models/Task';
import mongoose from 'mongoose';

// GET all tasks for the authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = { userId: session.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }

    let tasks = await Task.find(query).sort({ createdAt: -1 });

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
      );
    }

    // Convert tasks to plain objects with string IDs
    const tasksWithStringIds = tasks.map(task => ({
      ...task.toObject(),
      _id: task._id.toString(),
    }));

    return NextResponse.json({ tasks: tasksWithStringIds }, { status: 200 });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// CREATE a new task
export async function POST(request) {
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

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      status: status || 'To Do',
      userId: session.user.id,
    });

    // Convert task to plain object with string ID
    const taskWithStringId = {
      ...task.toObject(),
      _id: task._id.toString(),
    };

    return NextResponse.json(
      { message: 'Task created successfully', task: taskWithStringId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

