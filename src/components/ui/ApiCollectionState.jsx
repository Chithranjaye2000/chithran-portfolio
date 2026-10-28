import '../../styles/api-state.css'

export default function ApiCollectionState({ status, title, message, onRetry }) {
  return (
    <div className="api-collection-state" role={status === 'error' ? 'alert' : 'status'}>
      <h3>{title}</h3>
      <p>{message}</p>
      {status === 'error' && (
        <button type="button" className="button button--outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
