import type { Diagram } from "@/lib/plan/build";
import styles from "./Plan.module.css";

/**
 * Layered architecture diagram (users → apps → edge → services → data →
 * external). Built from the selected services, so it updates the moment the
 * customer changes a requirement; new nodes animate in. No hooks, so it renders
 * in the live builder (client) and the portal pages (server).
 */
export function ArchitectureDiagram({ diagram, caption }: { diagram: Diagram; caption?: string }) {
  const text = diagram.layers.map((l) => l.nodes.map((n) => n.label).join(", ")).join(", then ");
  return (
    <figure className={styles.diagram}>
      <ol className={styles.layers} aria-label={`Architecture: ${text}`}>
        {diagram.layers.map((layer) => (
          <li key={layer.id} className={styles.layer} data-layer={layer.id}>
            <span className={styles.layerLabel}>{layer.label}</span>
            <ul className={styles.nodes}>
              {layer.nodes.map((node) => (
                <li key={`${layer.id}-${node.id}-${node.label}`} className={styles.node}>
                  <span>{node.label}</span>
                  {node.note && <small>{node.note}</small>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
