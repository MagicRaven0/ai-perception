import { ContentText } from "@/components/content/ContentText";

/**
 * Who speaks in an episode, with each role. Shown in the 3D drawer and the 2D section, so a fictional guest's
 * "not a real person" role is always visible next to the name. Placeholder names render as hatched boxes.
 */
export function SpeakerList({ speakers }: { speakers: { name: string; role: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">Speakers</h3>
      <ul className="mt-1 flex flex-col gap-1.5 text-sm">
        {speakers.map((s, i) => (
          <li key={i}>
            <span className="font-medium">
              <ContentText value={s.name} />
            </span>
            <span className="text-muted">
              {" · "}
              <ContentText value={s.role} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
