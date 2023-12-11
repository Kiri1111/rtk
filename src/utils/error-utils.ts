import {ResponseType} from '../api/todolists-api'
import {Dispatch} from 'redux'
import {setAppError, setAppStatus} from "../app/app-reducer";

export const handleServerAppError = <D>(data: ResponseType<D>, dispatch: Dispatch) => {
	if (data.messages.length) {
		dispatch(setAppError({error: data.messages[0]}))
	} else {
		dispatch(setAppError({error: 'Some error occurred'}))
	}
	dispatch(setAppStatus({status: 'failed'}))
}

export const handleServerNetworkError = (error: { message: string }, dispatch: Dispatch) => {
	dispatch(setAppError({error: error.message ? error.message : 'Some error occurred'}))
	dispatch(setAppStatus({status: 'failed'}))
}
