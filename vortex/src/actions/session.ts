import { createAction } from 'redux-act';

export const setOpenBroomDialog = createAction('SET_OPEN_BROOM_DIALOG', (open: boolean) => open)
export const addBroomMessages = createAction('ADD_BROOM_MESSAGES', (msgList: string[]) => msgList)
export const clearBroomMessages = createAction('CLEAR_BROOM_MESSAGES', () => { })
export const setBroomMatchedFiles = createAction('SET_BROOM_MATCHED_FILES', (pathList) => pathList)