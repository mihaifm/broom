import { createAction } from 'redux-act'

export const setBroomDeleteFiles = createAction('SET_BROOM_DELETE_FILES', (flag: boolean) => flag)
export const setBroomUnhide = createAction('SET_BROOM_UNHIDE', (flag: boolean) => flag)