import { useDispatch } from 'react-redux';
import { confirmDialog } from 'primereact/confirmdialog';
import type { AppDispatch } from '../store';
import { resetGpx } from '../store/gpxSlice';
import { resetSegments, resetManualInputs } from '../store/segmentsSlice';
import { resetResults } from '../store/resultsSlice';
import { resetSettings } from '../store/settingsSlice';
import { useT } from '../i18n/useT';

export const useFullReset = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();

  return () => {
    confirmDialog({
      message: t.resetConfirmMessage,
      header: t.resetConfirmHeader,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t.resetConfirmAccept,
      rejectLabel: t.resetConfirmReject,
      acceptClassName: 'p-button-danger',
      accept: () => {
        dispatch(resetGpx());
        dispatch(resetSegments());
        dispatch(resetManualInputs());
        dispatch(resetResults());
        dispatch(resetSettings());
      },
    });
  };
};
