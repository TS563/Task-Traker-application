import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../Models/User';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 500 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    try {
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // Password will be hashed by the pre-save hook
      });

      return NextResponse.json(
        { message: 'User created successfully', userId: user._id },
        { status: 201 }
      );
    } catch (createError) {
      // Handle duplicate key error (email already exists)
      if (createError.code === 11000 || createError.name === 'MongoServerError') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
      throw createError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Signup error:', error);
    // Return more specific error message for debugging
    return NextResponse.json(
      { 
        error: 'Failed to create account. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

