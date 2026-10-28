import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, LoaderCircle } from 'lucide-react'
import { requestJson, resolveContactApiBase } from '../../utils/api'
import { confirmedContactResult, contactFieldLimits, validateContact } from '../../utils/contact'
import '../../styles/contact-form.css'

const emptyValues = { name: '', email: '', subject: '', message: '' }

export default function ContactForm() {
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const submitting = useRef(false)
  const focusErrors = useRef(false)
  const formRef = useRef(null)
  const requestRef = useRef(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const pending = status.kind === 'pending'

  useEffect(() => {
    if (pending || !focusErrors.current) return
    focusErrors.current = false
    const key = Object.keys(emptyValues).find((field) => errors[field])
    if (key) formRef.current?.elements.namedItem(key)?.focus()
  }, [errors, pending])

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const validation = validateContact(values)
    setErrors(validation.errors)
    if (Object.keys(validation.errors).length) {
      focusErrors.current = true
      setStatus({ kind: 'error', message: 'Please correct the highlighted fields.' })
      return
    }
    submitting.current = true
    const controller = new AbortController()
    requestRef.current = controller
    setStatus({ kind: 'pending', message: 'Sending your message…' })
    try {
      const response = await requestJson('/api/contact', {
        method: 'POST',
        baseUrl: resolveContactApiBase(),
        body: validation.values,
        signal: controller.signal,
      })
      const message = confirmedContactResult(response)
      if (!controller.signal.aborted) {
        setValues(emptyValues)
        setStatus({ kind: 'success', message })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const fields = Object.fromEntries(
          Object.keys(emptyValues)
            .filter((key) => typeof error.fields?.[key] === 'string')
            .map((key) => [key, error.fields[key]]),
        )
        focusErrors.current = Object.keys(fields).length > 0
        setErrors(fields)
        setStatus({ kind: 'error', message: error.message })
      }
    } finally {
      submitting.current = false
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  return (
    <div className="contact-form-panel" data-reveal>
      <div className="contact-form-heading">
        <h3>Send a message.</h3>
        <p>Have a question or an opportunity? I’d like to hear from you.</p>
      </div>
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        aria-label="Send a contact message"
        aria-busy={pending}
      >
        <fieldset disabled={pending}>
          <legend className="sr-only">Your message details</legend>
          <div className="contact-form-fields">
            {Object.keys(emptyValues).map((name) => (
              <div className={`contact-field contact-field--${name}`} key={name}>
                <label htmlFor={`contact-${name}`}>
                  {name === 'name'
                    ? 'Your name'
                    : name === 'email'
                      ? 'Email address'
                      : name === 'subject'
                        ? 'Subject (optional)'
                        : 'Message'}
                </label>
                {name === 'message' ? (
                  <textarea
                    id={`contact-${name}`}
                    name={name}
                    rows={6}
                    required
                    maxLength={contactFieldLimits[name]}
                    value={values[name]}
                    onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
                  />
                ) : (
                  <input
                    id={`contact-${name}`}
                    name={name}
                    type={name === 'email' ? 'email' : 'text'}
                    autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : 'off'}
                    required={name !== 'subject'}
                    maxLength={contactFieldLimits[name]}
                    value={values[name]}
                    onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
                  />
                )}
                {errors[name] && (
                  <p className="contact-field-error" id={`contact-${name}-error`}>
                    {errors[name]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="contact-form-actions">
            <button className="button button--white" type="submit" disabled={pending}>
              {pending ? 'Sending…' : 'Send message'}
              {pending ? (
                <LoaderCircle size={18} aria-hidden="true" />
              ) : (
                <ArrowUpRight size={18} aria-hidden="true" />
              )}
            </button>
            <p>Fields other than the subject are required.</p>
          </div>
        </fieldset>
        {status.message && (
          <p
            className={`contact-form-status contact-form-status--${status.kind}`}
            role={status.kind === 'error' ? 'alert' : 'status'}
          >
            {status.message}
          </p>
        )}
      </form>
    </div>
  )
}
