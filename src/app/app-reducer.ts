import {Dispatch} from 'redux'
import {authAPI} from '../api/todolists-api'
import {setIsLoggedIn} from '../features/Login/auth-reducer'
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: InitialStateType = {
	status: 'idle',
	error: null,
	isInitialized: false
}

const slice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setAppStatus: (state, action: PayloadAction<{ status: string }>) => {
			state.status = action.payload.status
		},
		setAppError: (state, action: PayloadAction<{ error: string | null }>) => {
			state.error = action.payload.error
		},
		setIsInitialized: (state, action: PayloadAction<{ isInitialized: boolean }>) => {
			state.isInitialized = action.payload.isInitialized
		}
	}
})

export const appReducer = slice.reducer

export const {setAppStatus, setIsInitialized, setAppError} = slice.actions

export type RequestStatusType = 'idle' | 'loading' | 'succeeded' | 'failed'
export type InitialStateType = {
	// происходит ли сейчас взаимодействие с сервером
	status: string
	// если ошибка какая-то глобальная произойдёт - мы запишем текст ошибки сюда
	error: string | null
	// true когда приложение проинициализировалось (проверили юзера, настройки получили и т.д.)
	isInitialized: boolean
}

export const initializeAppTC = () => (dispatch: Dispatch) => {
	authAPI.me().then(res => {
		if (res.data.resultCode === 0) {
			dispatch(setIsLoggedIn({isLoggedIn: true}));
		} else {
		}
		dispatch(setIsInitialized({isInitialized: true}));
	})
}

