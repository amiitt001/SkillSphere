import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getUserTasks, generateTasksFromGoal, toggleTaskStep, deleteUserTask } from '@/services/copilot/actionGenerator';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const tasks = await getUserTasks(uid);
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    logger.error('[Copilot Tasks API] Error loading tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const { goal, category } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: 'Missing goal string' }, { status: 400 });
    }

    const task = await generateTasksFromGoal(uid, goal, category || 'general');
    return NextResponse.json({ success: true, task });
  } catch (error) {
    logger.error('[Copilot Tasks API] Error generating tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const { taskId, stepIndex } = await req.json();

    if (!taskId || stepIndex === undefined) {
      return NextResponse.json({ error: 'Missing taskId or stepIndex' }, { status: 400 });
    }

    const updatedTask = await toggleTaskStep(uid, taskId, stepIndex);
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    logger.error('[Copilot Tasks API] Error toggling step:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    await deleteUserTask(uid, taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Copilot Tasks API] Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
