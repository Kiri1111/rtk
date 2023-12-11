import {appReducer, InitialStateType, setAppError, setAppStatus} from './app-reducer'
//
// let startState: InitialStateType;
//
// beforeEach(() => {
// 	startState = {
// 		error: '',
// 		status: 'idle',
// 		isInitialized: false
// 	}
// })
//
// test('correct error message should be set', () => {
// 	const endState = appReducer(startState, setAppError({error:'some error'}))
// 	expect(endState.error).toBe('some error');
// })
//
// test('correct status should be set', () => {
// 	const endState = appReducer(startState, setAppStatusAC('loading'))
// 	expect(endState.status).toBe('loading');
// })
//
