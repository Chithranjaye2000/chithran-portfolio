import { useState } from 'react'
import { ArrowUpRight, Film } from 'lucide-react'
import { videoCollectionUrl } from '../../data/videoProjects'
import { ExternalLink } from './Primitives'

function VideoThumbnail({ project }) {
  const [failedPath, setFailedPath] = useState(null)
  const hasThumbnail = project.thumbnailPath && failedPath !== project.thumbnailPath

  return (
    <div className="video-thumbnail">
      {hasThumbnail ? (
        <img
          src={project.thumbnailPath}
          alt={`Video thumbnail for ${project.title}`}
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
          onError={() => setFailedPath(project.thumbnailPath)}
        />
      ) : (
        <div className="video-thumbnail-missing">
          <Film size={28} strokeWidth={1.4} aria-hidden="true" />
          <span>Thumbnail not available yet</span>
          <span className="video-thumbnail-caption">
            Video collection available on Google Drive
          </span>
        </div>
      )}
    </div>
  )
}

export default function VideoCard({ project, featured = false }) {
  return (
    <article
      className={`video-card${featured ? ' video-card--featured' : ''}`}
      data-reveal
      data-tilt="quiet"
    >
      <VideoThumbnail project={project} />
      <div className="video-card-body">
        {featured && <p className="video-feature-label">Featured video</p>}
        <p className="video-category">{project.category}</p>
        <h3>{project.title}</h3>
        <p className="video-description">{project.description}</p>
        <div className="video-card-action">
          {videoCollectionUrl ? (
            <ExternalLink
              className={featured ? 'button' : 'text-link'}
              href={videoCollectionUrl}
              aria-describedby="video-collection-note"
              aria-label={`${featured ? 'Watch Videos on Google Drive' : 'View in Google Drive'}: ${project.title} — opens shared collection in a new tab`}
            >
              {featured ? 'Watch Videos on Google Drive' : 'View in Google Drive'}
              <ArrowUpRight size={17} aria-hidden="true" />
            </ExternalLink>
          ) : (
            <p className="video-link-pending">Video collection link coming soon</p>
          )}
          <span className="video-link-caption">Opens the shared video collection</span>
        </div>
      </div>
    </article>
  )
}
