import { useCallback, useRef } from 'react';
import { useAppDispatch } from '../app/hooks';
import { askConfirm } from '../features/ui/uiSlice';

// Resolves a promise from outside React's render cycle once the user answers
// the confirm dialog rendered by <ConfirmDialogHost/> (mounted once in App).
const resolvers = new Map();

export function resolveConfirmPromise(id, confirmed) {
  const resolve = resolvers.get(id);
  if (resolve) {
    resolve(confirmed);
    resolvers.delete(id);
  }
}

export function useConfirm() {
  const dispatch = useAppDispatch();
  const counter = useRef(0);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        counter.current += 1;
        const action = askConfirm(options);
        resolvers.set(action.payload.id, resolve);
        dispatch(action);
      }),
    [dispatch]
  );

  return confirm;
}
