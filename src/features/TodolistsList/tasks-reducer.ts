import {
	addTodolist,
	AddTodolistActionType,
	removeTodolist,
	RemoveTodolistActionType, setTodolists,
	SetTodolistsActionType
} from './todolists-reducer'
import {
	ArgUpdateTask,
	TaskPriorities,
	TaskStatuses,
	TaskType,
	todolistsAPI,
	UpdateTaskModelType
} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils'
import {setAppStatus} from "../../app/app-reducer";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
import {createAppAsyncThunk} from "../../utils/CreateAppAsyncThunks";

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
		// updateTask: (state, action: PayloadAction<{
		// 	taskId: string,
		// 	model: UpdateDomainTaskModelType,
		// 	todolistId: string
		// }>) => {
		// 	const tasks = state[action.payload.todolistId]
		// 	const index = tasks.findIndex(t => t.id === action.payload.taskId)
		// 	if (index !== -1) {
		// 		tasks[index] = {...tasks[index], ...action.payload.model}
		// 	}
		// },
	},
	extraReducers: builder => {
		builder
			.addCase(updateTask.fulfilled, (state, action) => {
					const tasks = state[action.payload.todolistId]
					const index = tasks.findIndex(t => t.id == action.payload.taskId)
					if (index !== -1) {
						tasks[index] = {...tasks[index], ...action.payload.domainModel}
					}
				}
			)
			.addCase(addTask.fulfilled, (state, action) => {
				state[action.payload.task.todoListId].unshift(action.payload.task)
			})
			.addCase(fetchTasks.fulfilled, (state, action) => {
				state[action.payload.todolistId] = action.payload.tasks
			})
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

const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[], todolistId: string }, string>
('tasks/fetchTasks', async (todolistId, thunkAPI) => {
	const {dispatch, rejectWithValue, fulfillWithValue} = thunkAPI
	try {
		dispatch(setAppStatus({status: 'loading'}))
		const res = await todolistsAPI.getTasks(todolistId)
		dispatch(setAppStatus({status: 'succeeded'}))
		return fulfillWithValue({tasks: res.data.items, todolistId})
	} catch (error: any) {
		handleServerNetworkError(error, dispatch)
		return rejectWithValue(null)
	}
})

const addTask = createAppAsyncThunk<{ task: TaskType }, { title: string, todolistId: string }>
('tasks/addTask', async (arg, thunkAPI) => {
	const {dispatch, rejectWithValue} = thunkAPI
	try {
		dispatch(setAppStatus({status: 'loading'}))
		const res = await todolistsAPI.createTask(arg)
		if (res.data.resultCode === 0) {
			return {task: res.data.data.item}   //TaskType
		} else {
			handleServerNetworkError({message: 'error at add task'}, dispatch)
			return rejectWithValue(null)
		}
	} catch (e: any) {
		handleServerNetworkError(e, dispatch)
		return rejectWithValue(null)
	} finally {
		dispatch(setAppStatus({status: 'succeeded'}))
	}
})

const updateTask = createAppAsyncThunk<ArgUpdateTask, ArgUpdateTask>('task/updateTask', async (arg, thunkAPI) => {
	const {dispatch, rejectWithValue, fulfillWithValue, getState} = thunkAPI
	try {
		const state = getState()
		const task = state.tasks[arg.todolistId].find(t => t.id === arg.taskId)
		if (!task) {
			return rejectWithValue(null)
		}

		const apiModel: UpdateTaskModelType = {
			deadline: task.deadline,
			description: task.description,
			priority: task.priority,
			startDate: task.startDate,
			title: task.title,
			status: task.status,
			...arg
		}
		const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
		if (res.data.resultCode === 0) {
			return arg
		} else {
			handleServerAppError(res.data, dispatch)
			return rejectWithValue(null)
		}
	} catch (e: any) {
		handleServerNetworkError(e, dispatch)
		return rejectWithValue(null)

	} finally {
		dispatch(setAppStatus({status: 'succeeded'}))
	}

})
// export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
// 	(dispatch: ThunkDispatch, getState: () => AppRootStateType) => {
// 		const state = getState()
// 		const task = state.tasks[todolistId].find((t: any) => t.id === taskId)
// 		if (!task) {
// 			//throw new Error("task not found in the state");
// 			console.warn('task not found in the state')
// 			return
// 		}
//
// 		const apiModel: UpdateTaskModelType = {
// 			deadline: task.deadline,
// 			description: task.description,
// 			priority: task.priority,
// 			startDate: task.startDate,
// 			title: task.title,
// 			status: task.status,
// 			...domainModel
// 		}
//
// 		todolistsAPI.updateTask(todolistId, taskId, apiModel)
// 			.then(res => {
// 				if (res.data.resultCode === 0) {
// 					const action = updateTask({taskId, model: domainModel, todolistId})
// 					dispatch(action)
// 				} else {
// 					handleServerAppError(res.data, dispatch);
// 				}
// 			})
// 			.catch((error) => {
// 				handleServerNetworkError(error, dispatch);
// 			})
// 	}

export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch) => {
	todolistsAPI.deleteTask(todolistId, taskId)
		.then(res => {
			const action = removeTask({taskId, todolistId})
			dispatch(action)
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
type ThunkDispatch = Dispatch

export const tasksReducer = slice.reducer

export const {removeTask} = slice.actions

export const taskThunks = {fetchTasks, addTask, updateTask}