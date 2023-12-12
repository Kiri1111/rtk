import {ResponseType} from '../api/todolists-api'
import {Dispatch} from 'redux'
import {setAppError, setAppStatus} from "../app/app-reducer";
import axios from "axios";

export const handleServerAppError = <D>(data: ResponseType<D>, dispatch: Dispatch) => {
	if (data.messages.length) {
		dispatch(setAppError({error: data.messages[0]}))
	} else {
		dispatch(setAppError({error: 'Some error occurred'}))
	}
	dispatch(setAppStatus({status: 'failed'}))
}

export const handleServerNetworkError = (error: { message: string }, dispatch: Dispatch) => {
	let errorMessage = 'Some error occurred'
	if (axios.isAxiosError(error)) {
		errorMessage = error.response?.data.message || error.message || errorMessage
	} else if (error instanceof Error) {
		errorMessage = `Native error : ${error.message}`
	} else {
		errorMessage = JSON.stringify(error)
	}
	dispatch(setAppError({error: errorMessage}))
	dispatch(setAppStatus({status: 'failed'}))
}
