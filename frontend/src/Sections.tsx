// NOTE: placeholder content - update to match real DroneTV offerings from dronetv.in
const SERVICES = [['🎥', 'Aerial Videography', 'Cinematic drone shoots for events, real estate and brands.'], ['🗺️', 'Survey & Mapping', 'Accurate aerial surveys and mapping for projects.'], ['📰', 'Drone Media & Content', 'News, features and videos from the drone industry.']];
const COURSES = [['🎓', 'Drone Pilot Basics', 'Beginner course: flying, safety and regulations.'], ['🛠️', 'Advanced Operations', 'Mapping, inspection and professional workflows.'], ['🎬', 'Aerial Cinematography', 'Shooting and editing professional drone footage.']];
const Grid = ({ id, title, items }: { id: string; title: string; items: string[][] }) => (
  <section id={id}><h2>{title}</h2><div className="grid">{items.map(([i, t, d]) => <div className="card" key={t}><span className="ico">{i}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>);
export default function Sections() { return <><Grid id="services" title="Our Services" items={SERVICES} /><Grid id="courses" title="Courses & Training" items={COURSES} /></>; }
