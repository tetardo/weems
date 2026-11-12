import {
  ChartIcon,
  ExternalIcon,
  HistoryIcon,
  MapIcon,
  ProfileIcon,
  VisitorsIcon,
} from "../../ui/icons.ts";

function Fill(props: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  link: string;
}) {
  return (
    <div className="c">
      <div className="t">
        {props.icon} {props.title}
      </div>
      <p>{props.text}</p>
      <a href={props.href} target="_blank" rel="noreferrer">
        <ExternalIcon size={14} /> {props.link}
      </a>
    </div>
  );
}

/** The pages of the site the simulated activity fills, with a link to each (local site). */
export function FillsPanel({
  siteUrl,
  sampleHandle,
}: {
  siteUrl: string;
  sampleHandle: string | null;
}) {
  const site = `${siteUrl}/fr`;
  const profile = sampleHandle ? `${site}/pilots/${sampleHandle}` : `${siteUrl}/fr`;
  return (
    <section className="panel fills">
      <h2>
        <VisitorsIcon size={16} /> Ce que ça remplit sur le site
      </h2>
      <div className="g">
        <Fill
          icon={<MapIcon size={16} />}
          title="Carte en direct"
          text="Les vols en direct des comptes fictifs, avec trajets et progression. Les visiteurs ne se voient pas : ils chargent l'API."
          href={`${site}/live`}
          link="Ouvrir la carte"
        />
        <Fill
          icon={<ProfileIcon size={16} />}
          title="Profils publics"
          text="Pays, aéroport de base, niveau, avec le badge « Compte fictif »."
          href={profile}
          link={sampleHandle ? "Ouvrir un profil" : "Ouvrir le site"}
        />
        <Fill
          icon={<HistoryIcon size={16} />}
          title="Historique des vols"
          text="Vols passés notés, avec trajectoire. Connexion avec l'e-mail d'un compte fictif et le mot de passe « weems-fictif »."
          href={`${site}/login`}
          link="Se connecter"
        />
        <Fill
          icon={<ChartIcon size={16} />}
          title="Compteurs et graphiques"
          text="Les compteurs et graphiques du profil : séries, heures de décollage, touchers, catégories d'avion."
          href={profile}
          link={sampleHandle ? "Voir les graphiques" : "Ouvrir le site"}
        />
      </div>
    </section>
  );
}
