import { types, util } from 'vortex-api'

import * as actions from '../actions/session';

const sessionReducer: types.IReducerSpec = {
    reducers: {
        [actions.setOpenBroomDialog as any]: (state, payload) => {
            return util.setSafe(state, ['open'], payload);
        },
        [actions.addBroomMessages as any]: (state, payload) => {
            const currentMessages = util.getSafe(state, ['messages'], []);
            return util.setSafe(state, ['messages'], currentMessages.concat(payload));
        },
        [actions.clearBroomMessages as any]: (state) => {
            return util.setSafe(state, ['messages'], []);
        },
        [actions.setBroomMatchedFiles as any]: (state, payload) => {
            return util.setSafe(state, ['matchedFiles'], payload);
        }
    },
    defaults: {
        open: false,
        messages: [],
        matchedFiles: []
    }
}

export default sessionReducer;