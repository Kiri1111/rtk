import {
	addTodolist,
	AddTodolistActionType,
	removeTodolist,
	RemoveTodolistActionType, setTodolists,
	SetTodolistsActionType
} from './todolists-reducer'
import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils'
import {setAppStatus} from "../../app/app-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: TasksStateType = {}

const slice = createSlice({
	name: 'tasks',
	initialState,
	reducers: {
		removeTask: (state, action: PayloadAction<{ taskId: string, todolistId: string }>) => {
			const tasks = state[action.payload.todolistId]
			const index = tasks.findIndex(t => t.id === action.payload.taskId)
			if (index !== -1) tasks.splice(index, 1)
		},
		addTask: (state, action: PayloadAction<{ task: TaskType }>) => {
			const tasks = state[action.payload.task.todoListId]
			tasks.unshift(action.payload.task)
		},
		updateTask: (state, action: PayloadAction<{
			taskId: string,
			model: UpdateDomainTaskModelType,
			todolistId: string
		}>) => {
			const tasks = state[action.payload.todolistId]
			const index = tasks.findIndex(t => t.id === action.payload.taskId)
			if (index !== -1) {
				tasks[index] = {...tasks[index], ...action.payload.model}
			}
		},
		setTasks: (state, action: PayloadAction<{ tasks: Array<TaskType>, todolistId: string }>) => {
			state[action.payload.todolistId] = action.payload.tasks
		},
	},
	extraReducers: builder => {
		builder
			.addCase(addTodolist, (state, action) => {
				state[action.payload.todolist.id] = []
			})
			.addCase(removeTodolist, (state, action) => {
				delete state[action.payload.todolistId]
			})
			.addCase(setTodolists, (state, action) => {
				action.payload.todolists.forEach(tl => {
					state[tl.id] = []
				})
			})
	}
})

export const tasksReducer = slice.reducer

const {removeTask, setTasks, addTask, updateTask} = slice.actions

// thunks
export const fetchTasksTC = (todolistId: string) => (dispatch: Dispatch) => {
	dispatch(setAppStatus({status: 'loading'}))
	todolistsAPI.getTasks(todolistId)
		.then((res) => {
			const tasks = res.data.items
			dispatch(setTasks({tasks, todolistId}))
			dispatch(setAppStatus({status: 'succeeded'}))
		})
}
export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
	todolistsAPI.deleteTask(todolistId, taskId)
		.then(res => {
			const action = removeTask({taskId, todolistId})
			dispatch(action)
		})
}
export const addTaskTC = (title: string, todolistId: string) => (dispatch: Dispatch) => {
	dispatch(setAppStatus({status: 'loading'}))
	todolistsAPI.createTask(todolistId, title)
		.then(res => {
			if (res.data.resultCode === 0) {
				const task = res.data.data.item
				const action = addTask({task})
				dispatch(action)
				dispatch(setAppStatus({status: 'succeeded'}))
			} else {
				handleServerAppError(res.data, dispatch);
			}
		})
		.catch((error) => {
			handleServerNetworkError(error, dispatch)
		})
}
export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
	(dispatch: ThunkDispatch, getState: () => AppRootStateType) => {
		const state = getState()
		const task = state.tasks[todolistId].find((t: any) => t.id === taskId)
		if (!task) {
			//throw new Error("task not found in the state");
			console.warn('task not found in the state')
			return
		}

		const apiModel: UpdateTaskModelType = {
			deadline: task.deadline,
			description: task.description,
			priority: task.priority,
			startDate: task.startDate,
			title: task.title,
			status: task.status,
			...domainModel
		}

		todolistsAPI.updateTask(todolistId, taskId, apiModel)
			.then(res => {
				if (res.data.resultCode === 0) {
					const action = updateTask({taskId, model: domainModel, todolistId})
					dispatch(action)
				} else {
					handleServerAppError(res.data, dispatch);
				}
			})
			.catch((error) => {
				handleServerNetworkError(error, dispatch);
			})
	}

// types
export type UpdateDomainTaskModelType = {
	title?: string
	description?: string
	status?: TaskStatuses
	priority?: TaskPriorities
	startDate?: string
	deadline?: string
}
export type TasksStateType = {
	[key: string]: Array<TaskType>
}
type ActionsType =
	| ReturnType<typeof removeTask>
	| ReturnType<typeof addTask>
	| ReturnType<typeof updateTask>
	| AddTodolistActionType
	| RemoveTodolistActionType
	| SetTodolistsActionType
	| ReturnType<typeof setTasks>
type ThunkDispatch = Dispatch
