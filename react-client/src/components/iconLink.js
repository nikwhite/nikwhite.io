import './iconLink.css'

function IconLink(props) {
  return (
    <a 
      className={`iconLink ${props.icon}-link`}
      href={props.url}
      target="_blank"
      rel="noreferrer">
      <i className={`icon-${props.icon}`}></i>
    </a>
  )
}

export default IconLink