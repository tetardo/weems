import type { AdminAccountList } from "@weems/contrats";
import { AccountRow, InvitationRow, type RowActions } from "./account-row.tsx";
import { type Filter, rowsOf } from "./rows.ts";

export function AccountsTable(props: {
  list: AdminAccountList;
  filter: Filter;
  search: string;
  me: string;
  actions: RowActions;
}) {
  const rows = rowsOf(props.list, props.filter, props.search);
  /** Tab Invitations: the column of the plan shows the invitation code instead. */
  const showCode = props.filter === "invitations";
  return (
    <section className="panel tbl">
      <table>
        <thead>
          <tr>
            <th>Compte</th>
            <th>Rôle</th>
            <th>{showCode ? "Code" : "Formule"}</th>
            <th>État</th>
            <th>Vols</th>
            <th>Créé le</th>
            <th>Connexion</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            row.kind === "account" ? (
              <AccountRow
                key={row.account.id}
                account={row.account}
                me={props.me}
                actions={props.actions}
              />
            ) : (
              <InvitationRow
                key={row.invitation.code}
                invitation={row.invitation}
                actions={props.actions}
                showCode={showCode}
              />
            ),
          )}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty">Aucun compte ne correspond.</div>}
    </section>
  );
}
