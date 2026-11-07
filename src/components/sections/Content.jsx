import { useState } from 'react'
import { FolderOpen, Scissors } from 'lucide-react'
import { videoCategories, videoProjects } from '../../data/videoProjects'
import { SectionHeading } from '../ui/Primitives'
import VideoCard from '../ui/VideoCard'
import '../../styles/videos.css'

export default function Content() {
  const [filter, setFilter] = useState('All Videos')
  const visible =
    filter === 'All Videos'
      ? videoProjects
      : videoProjects.filter((project) => project.category === filter)
  const featured = visible.find((project) => project.featured)
  const remaining = visible.filter((project) => project !== featured)

  return (
    <section id="content" className="section video-section" aria-labelledby="content-title">
      <div className="container">
        <div className="section-header-row">
          <SectionHeading
            eyebrow="06 / Video portfolio"
            title="Technical videos"
            id="content-title"
          >
            I create software demos, onboarding walkthroughs, capability videos, and launch videos.
            You can find the full collection on Google Drive.
          </SectionHeading>
          <p className="editing-note">
            <Scissors size={15} aria-hidden="true" />
            Video editing: CapCut
          </p>
        </div>
        <p className="video-collection-note" id="video-collection-note" data-reveal>
          <FolderOpen size={19} aria-hidden="true" />
          All video links open the shared Google Drive collection in a new tab. Choose the matching
          video inside the folder.
        </p>
        <div
          className="project-filters video-filters"
          role="group"
          aria-label="Filter videos by category"
        >
          {['All Videos', ...Object.values(videoCategories)].map((category) => (
            <button
              key={category}
              aria-pressed={category === filter}
              aria-controls="video-results"
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="video-result-count" role="status" aria-atomic="true">
          Showing {visible.length} {visible.length === 1 ? 'video' : 'videos'} · {filter}
        </p>
        <div id="video-results">
          {featured && <VideoCard key={featured.id} project={featured} featured />}
          <div className="video-grid" data-stagger>
            {remaining.map((project) => (
              <VideoCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
