"use client";
import { usePortfolio } from "../PortfolioProvider";
import BrandLogo from "../BrandLogo";
import styles from "../../styles/site/nav.module.css";

/*
  Slim top strip with the name. Section navigation lives in the floating dock (SiteDock),
  so this strip is not sticky — it scrolls away with the hero and keeps the page clean.
*/
export default function SiteNav() {
  const DATA = usePortfolio();
  const parts = DATA.name?.trim().split(/\s+/) ?? [];
  const firstName = parts[0] || "Janmenjaya";
  const lastName = parts.slice(1).join(" ");

  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <a href="#hero" className={styles.navBrand} aria-label={`${DATA.name || "Home"} — back to top`}>
          <BrandLogo size={36} className={styles.navBrandLogo} />
          <span className={styles.navBrandName}>
            <span className={styles.navBrandFirst}>{firstName}</span>
            {lastName ? <span className={styles.navBrandLast}>{lastName}</span> : null}
          </span>
        </a>
      </div>
    </header>
  );
}
