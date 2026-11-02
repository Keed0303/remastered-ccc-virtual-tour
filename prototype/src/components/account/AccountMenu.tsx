interface AccountMenuProps { name: string; isAdmin: boolean; onCustomize: () => void; onLogOut: () => void }

export function AccountMenu({ name, isAdmin, onCustomize, onLogOut }: AccountMenuProps) {
  return (
    <section id="step-account">
      <h2>Hi, <span id="account-name">{name}</span>!</h2>
      <div className="dialog-actions column">
        {isAdmin && <a id="account-admin" className="primary wide admin-link" href="/admin">Open admin page</a>}
        <button id="account-customize" type="button" className="primary wide" onClick={onCustomize}>Customize character</button>
        <button id="account-logout" type="button" className="ghost wide" onClick={onLogOut}>Log out</button>
      </div>
    </section>
  );
}
