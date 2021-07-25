import { types } from 'vortex-api';
import BroomDialog from './views/BroomDialog'
import Settings from './views/Settings'

import sessionReducer from './reducers/session';
import settingsReducer from './reducers/settings'
import { setOpenBroomDialog } from './actions/session'

function main(context: types.IExtensionContext) {
    context.registerAction("mod-icons", 500, 'plugin-light', {}, 'Broom', () => {
        context.api.store.dispatch(setOpenBroomDialog(true))
    })

    context.registerReducer(['session', 'broom'], sessionReducer);
    context.registerReducer(['settings', 'interface'], settingsReducer);

    context.registerDialog('broom-dialog', BroomDialog, () => ({}))
    context.registerSettings('Interface', Settings, undefined, undefined, 69);

    return true;
}

export default main;