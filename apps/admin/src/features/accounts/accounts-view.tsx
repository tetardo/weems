"use client";

import type { AdminAccount } from "@weems/contrats";
import { useState } from "react";
import { type AccountsPage, logOut, readAccounts } from "../../actions/accounts.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import { AccountsIcon, InviteIcon, LogOutIcon, SearchIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { usePolling } from "../../ui/use-polling.ts";
import { AccountsTable } from "./accounts-table.tsx";
import { InviteDrawer } from "./invite-drawer.tsx";
import { LoginForm } from "./login-form.tsx";
import { countsOf, type Filter } from "./rows.ts";
import { useAccountActions } from "./use-account-actions.ts";

type Ready = Extract<AccountsPage, { status: "ready" }>;

function Filters(props: { page: Ready; filter: Filter; onFilter: (f: Filter) => void }) {
  const counts = countsOf(props.page.list, Date.now());
  const chips: [Filter, string, number][] = [
    ["all", "Tous", counts.accounts + counts.invitations],
    ["pilots", "Pilotes", counts.pilots],
    ["admins", "Administrateurs", counts.admins],
    ["invitations", "Invitations", counts.invitations],
  ];
  return (
    <>
      {chips.map(([filter, label, count]) => (
        <button
          key={filter}
          className={`chip ${props.filter === filter ? "on" : ""}`}
          onClick={() => props.onFilter(filter)}
        >
          {label} <span className="m">{count}</span>
        </button>
      ))}
    </>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

function Subtitle({ page }: { page: Ready }) {
  const c = countsOf(page.list, Date.now());
  const expired = c.expired > 0 ? ` (${c.expired} expirée${c.expired > 1 ? "s" : ""})` : "";
  return (
    <>
      {plural(c.accounts, "compte")} · {plural(c.admins, "administrateur")} ·{" "}
      {plural(c.invitations, "invitation")}
      {expired}
    </>
  );
}

function Toolbar(props: {
  page: Ready;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  search: string;
  onSearch: (search: string) => void;
}) {
  return (
    <div className="toolbar">
      <Filters page={props.page} filter={props.filter} onFilter={props.onFilter} />
      <label className="search">
        <SearchIcon size={16} />
        <input
          placeholder="Nom, e-mail…"
          value={props.search}
          onChange={(e) => props.onSearch(e.target.value)}
        />
      </label>
    </div>
  );
}

function DisableDialog(props: {
  account: AdminAccount;
  onCancel: () => void;
  onConfirm: (a: AdminAccount) => void;
}) {
  return (
    <ConfirmDialog
      title={`Désactiver ${props.account.name} ?`}
      confirmLabel="Désactiver"
      onCancel={props.onCancel}
      onConfirm={() => props.onConfirm(props.account)}
    >
      <p className="muted">
        Ses sessions et les jetons de son tracker sont révoqués tout de suite. Ses vols restent. Le
        compte peut être réactivé.
      </p>
    </ConfirmDialog>
  );
}

function Title(props: { page: Ready; onLogOut: () => void; onInvite: () => void }) {
  return (
    <PageTitle
      icon={<AccountsIcon />}
      title="Comptes"
      subtitle={<Subtitle page={props.page} />}
      actions={
        <>
          <button className="btn ghost" onClick={props.onLogOut}>
            <LogOutIcon size={16} /> {props.page.me.name}
          </button>
          <button className="btn" onClick={props.onInvite}>
            <InviteIcon size={16} /> Créer un compte
          </button>
        </>
      }
    />
  );
}

function ReadyView({ page, refresh }: { page: Ready; refresh: () => Promise<void> }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const rows = useAccountActions(page.siteUrl, refresh);
  return (
    <>
      <Title
        page={page}
        onLogOut={() => void logOut().then(refresh)}
        onInvite={() => setInviting(true)}
      />
      <Toolbar
        page={page}
        filter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
      />
      <ErrorBox message={rows.error} />
      {rows.message && <p className="note">{rows.message}</p>}
      <AccountsTable
        list={page.list}
        filter={filter}
        search={search}
        me={page.me.id}
        actions={rows.actions}
      />
      {inviting && (
        <InviteDrawer
          siteUrl={page.siteUrl}
          onClose={() => void refresh().then(() => setInviting(false))}
        />
      )}
      {rows.toDisable && (
        <DisableDialog
          account={rows.toDisable}
          onCancel={rows.cancelDisable}
          onConfirm={(account) => void rows.confirmDisable(account)}
        />
      )}
    </>
  );
}

/** Page Comptes (spec admin): login, then accounts and invitations. */
export function AccountsView() {
  const { value, error, refresh } = usePolling(readAccounts, 15_000);
  if (!value) return <ErrorBox message={error} />;
  if (value.status === "login") {
    return (
      <>
        <PageTitle
          icon={<AccountsIcon />}
          title="Comptes"
          subtitle="Connexion administrateur requise"
        />
        <ErrorBox message={error} />
        <LoginForm reason={value.reason} onDone={() => void refresh()} />
      </>
    );
  }
  return <ReadyView page={value} refresh={refresh} />;
}
