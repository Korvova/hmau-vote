import React, { useEffect, useRef, useState } from 'react';

function HeaderDropdown({
  trigger,
  children,
  className = '',
  triggerClassName = '',
  menuClassName = 'sub-menu',
  defaultOpen = false,
  closeOnMenuClick = true,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const itemRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleDocumentClick = (event) => {
      if (!itemRef.current) return;
      if (itemRef.current.contains(event.target)) return;
      setOpen(false);
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [open]);

  const toggleOpen = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setOpen((prev) => !prev);
  };

  const handleMenuClick = (event) => {
    if (!closeOnMenuClick) return;
    if (event.target.closest('a, button')) {
      setOpen(false);
    }
  };

  const hasMenu = React.Children.count(children) > 0;

  const liClass = [
    'menu-children',
    open ? 'current-menu-item' : null,
    className || null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li ref={itemRef} className={liClass}>
      <a href="#!" className={triggerClassName} onClick={toggleOpen}>
        {typeof trigger === 'function' ? trigger({ open }) : trigger}
      </a>
      {hasMenu ? (
        <ul
          className={menuClassName}
          style={{ display: open ? 'block' : 'none' }}
          onClick={handleMenuClick}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </ul>
      ) : null}
    </li>
  );
}

export default HeaderDropdown;