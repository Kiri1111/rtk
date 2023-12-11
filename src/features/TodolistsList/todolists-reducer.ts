import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {RequestStatusType, setAppStatus,} from '../../app/app-reducer'
import {handleServerNetworkError} from '../../utils/error-utils'
import {AppThunk} from '../../app/store';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: Array<TodolistDomainType> = []

const slice = createSlice({
	name: 'todolist',
	initialState,
	reducers: {
		removeTodolist: (state, action: PayloadAction<{ todolistId: string }>) => {
			const index = state.findIndex(tl => tl.id === action.payload.todolistId)
			state.splice(index, 1)
		},
		addTodolist: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
			const newTodolist: TodolistDomainType = {...action.payload.todolist, filter: 'all', entityStatus: 'idle'}
			state.unshift(newTodolist)
		},
		changeTodolistTitle: (state, action: PayloadAction<{ title: string, id: string }>) => {
			const todo = state.find(tl => tl.id === action.payload.id)
			if (todo) {
				todo.title = action.payload.title
			}
		},
		changeTodolistFilter: (state, action: PayloadAction<{ filter: FilterValuesType, id: string }>) => {
			const todo = state.find(tl => tl.id === action.payload.id)
			if (todo) {
				todo.filter = action.payload.filter
			}
		},
		changeTodolistEntityStatus: (state, action: PayloadAction<{ entityStatus: RequestStatusType, id: string }>) => {
			const todo = state.find(tl => tl.id === action.payload.id)
			if (todo) {
				todo.entityStatus = action.payload.entityStatus
			}
		},
		setTodolists: (state, action: PayloadAction<{ todolists: TodolistType[] }>) => {
			return action.payload.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))
		}

	}
})

export const todolistsReducer = slice.reducer

export const {
	removeTodolist,
	changeTodolistEntityStatus,
	changeTodolistFilter,
	changeTodolistTitle,
	setTodolists,
	addTodolist
} = slice.actions


// thunks
export const fetchTodolistsTC = (): AppThunk => {
	return (dispatch) => {
		dispatch(setAppStatus({status: 'loading'}))
		todolistsAPI.getTodolists()
			.then((res) => {
				dispatch(setTodolists({todolists: res.data}))
				dispatch(setAppStatus({status: 'succeeded'}))
			})
			.catch(error => {
				handleServerNetworkError(error, dispatch);
			})
	}
}
export const removeTodolistTC = (todolistId: string) => {
	return (dispatch: ThunkDispatch) => {
		//изменим глобальный статус приложения, чтобы вверху полоса побежала
		dispatch(setAppStatus({status: 'loading'}))
		//изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
		dispatch(changeTodolistEntityStatus({id: todolistId, entityStatus: 'loading'}))
		todolistsAPI.deleteTodolist(todolistId)
			.then((res) => {
				dispatch(removeTodolist({todolistId}))
				//скажем глобально приложению, что асинхронная операция завершена
				dispatch(setAppStatus({status: 'succeeded'}))
			})
	}
}
export const addTodolistTC = (title: string) => {
	return (dispatch: ThunkDispatch) => {
		dispatch(setAppStatus({status: 'loading'}))
		todolistsAPI.createTodolist(title)
			.then((res) => {
				dispatch(addTodolist({todolist: res.data.data.item}))
				dispatch(setAppStatus({status: 'succeeded'}))
			})
	}
}
export const changeTodolistTitleTC = (id: string, title: string) => {
	return (dispatch: Dispatch<ActionsType>) => {
		todolistsAPI.updateTodolist(id, title)
			.then((res) => {
				dispatch(changeTodolistTitle({id, title}))
			})
	}
}

// types
export type AddTodolistActionType = ReturnType<typeof addTodolist>;
export type RemoveTodolistActionType = ReturnType<typeof removeTodolist>;
export type SetTodolistsActionType = ReturnType<typeof setTodolists>;
type ActionsType =
	| RemoveTodolistActionType
	| AddTodolistActionType
	| ReturnType<typeof changeTodolistTitle>
	| ReturnType<typeof changeTodolistFilter>
	| SetTodolistsActionType
	| ReturnType<typeof changeTodolistEntityStatus>
export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
	filter: FilterValuesType
	entityStatus: RequestStatusType
}
type ThunkDispatch = Dispatch
