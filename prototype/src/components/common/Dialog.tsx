import { type ComponentProps, useEffect, useRef } from 'react';

interface DialogProps extends ComponentProps<'dialog'> { isOpen: boolean; onDismiss: () => void }

// A native modal <dialog> driven by a prop. Esc and form closes report back through onDismiss.
export function Dialog({ isOpen, onDismiss, children, ...props }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (isOpen && !d.open) d.showModal();
    else if (!isOpen && d.open) d.close();
  }, [isOpen]);
  return <dialog ref={ref} onClose={onDismiss} {...props}>{children}</dialog>;
}
