import test from 'node:test';
import assert from 'node:assert/strict';
import { useAppStore } from './useAppStore.ts';

test('store initializes with default state and can toggle mode', () => {
  const store = useAppStore.getState();
  assert.equal(store.mode, 'task');

  store.setMode('chat');
  assert.equal(useAppStore.getState().mode, 'chat');

  store.setMode('task');
  assert.equal(useAppStore.getState().mode, 'task');
});

test('createNewTask prepends task to tasks list and sets activeTaskId', async () => {
  const store = useAppStore.getState();
  const initialCount = store.tasks.length;

  const newTask = await store.createNewTask('Refactor layout components', 'task');
  const updatedState = useAppStore.getState();

  assert.equal(updatedState.tasks.length, initialCount + 1);
  assert.equal(updatedState.tasks[0].id, newTask.id);
  assert.equal(updatedState.activeTaskId, newTask.id);
  assert.equal(newTask.mode, 'task');
  assert.ok(newTask.steps.length > 0);
});

test('sidebar toggle alters collapsed state', () => {
  const store = useAppStore.getState();
  const initial = store.sidebarCollapsed;

  store.toggleSidebar();
  assert.equal(useAppStore.getState().sidebarCollapsed, !initial);

  store.setSidebarCollapsed(false);
  assert.equal(useAppStore.getState().sidebarCollapsed, false);
});

test('resetToNewChat clears activeTaskId and composerText', () => {
  const store = useAppStore.getState();
  store.setComposerText('Drafting prompt...');
  store.setActiveTaskId('task-1');

  store.resetToNewChat();
  const state = useAppStore.getState();
  assert.equal(state.activeTaskId, null);
  assert.equal(state.composerText, '');
  assert.equal(state.currentRoute, 'new-chat');
});
