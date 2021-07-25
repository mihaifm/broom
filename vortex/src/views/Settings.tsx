import * as React from 'react';
import { ControlLabel } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ComponentEx, More, Toggle, types, util } from 'vortex-api';
import { setBroomDeleteFiles, setBroomUnhide } from '../actions/settings';

interface IBaseProps {
}

interface IConnectedProps {
    deleteFiles: boolean;
    unhide: boolean;
}

interface IActionProps {
    onSetDeleteFiles: (flag: boolean) => void;
    onSetUnhide: (flag: boolean) => void;
}

type IProps = IBaseProps & IActionProps & IConnectedProps;

class Settings extends ComponentEx<IProps, {}> {
    public render(): JSX.Element {
        const { t, deleteFiles, unhide } = this.props;
        return (
            <div>
                <ControlLabel>{t('Broom - The Loose File Sweeper')}</ControlLabel>
                <Toggle checked={deleteFiles} onToggle={this.toggleDeleteFiles}>
                    {t('Delete files instead of hiding them')}
                    <More id='broom-delete-files' name='Delete files instead of hiding them'>
                        {t('If this is enabled, the Hide Files button on the Broom dialog will change to Delete Files. ' +
                            'Matching files will be permanently deleted. Use this option with care.')}
                    </More>
                </Toggle>
                <Toggle checked={unhide} onToggle={this.toggleUnhide}>
                    {t('Unhide files')}
                    <More id='broom-unhide-files' name='Unhide files'>
                        {t('Revert the hide operation by finding all matching files and removing the .vohidden extension. ' +
                            'Incompatible with the "Delete files" option.')}
                    </More>
                </Toggle>
            </div>
        );
    }

    private toggleDeleteFiles = (enabled: boolean) => {
        const { onSetDeleteFiles } = this.props;
        onSetDeleteFiles(enabled)
    }

    private toggleUnhide = (enabled: boolean) => {
        const { onSetUnhide } = this.props;
        onSetUnhide(enabled)
    }
}

function mapStateToProps(state: types.IState): IConnectedProps {
    return {
        deleteFiles: util.getSafe(state, ['settings', 'interface', 'broomDeleteFiles'], false),
        unhide: util.getSafe(state, ['settings', 'interface', 'broomUnhide'], false),
    };
}

function mapDispatchToProps(dispatch): IActionProps {
    return {
        onSetDeleteFiles: (flag: boolean) => dispatch(setBroomDeleteFiles(flag)),
        onSetUnhide: (flag: boolean) => dispatch(setBroomUnhide(flag)),
    };
}

export default withTranslation(['common', 'broom'])(
    connect(mapStateToProps, mapDispatchToProps)(Settings) as any) as React.ComponentClass<IBaseProps>;