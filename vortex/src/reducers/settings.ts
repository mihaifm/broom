import { types, util } from 'vortex-api'

import * as actions from '../actions/settings';

const settingsReducer: types.IReducerSpec = {
    reducers: {
        [actions.setBroomDeleteFiles as any]: (state, payload) => {
            var flag = util.getSafe(state, ['broomDeleteFiles'], false)

            if (flag === false)
                return util.setSafe(util.setSafe(state, ['broomUnhide'], false), ['broomDeleteFiles'], true);
            else
                return util.setSafe(state, ['broomDeleteFiles'], payload);
        },
        [actions.setBroomUnhide as any]: (state, payload) => {
            var flag = util.getSafe(state, ['broomUnhide'], false)

            if (flag === false)
                return util.setSafe(util.setSafe(state, ['broomDeleteFiles'], false), ['broomUnhide'], true);
            else
                return util.setSafe(state, ['broomUnhide'], payload);
        },
    },
    defaults: {
        deleteFiles: false,
        unhide: false
    }
}

export default settingsReducer;