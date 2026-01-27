import React from 'react'
import './Spinner.css'

const Spinner = ({
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  text,
  dots = true,
  variant = 'default', // 'default' | 'hexagon'
  className = '',
  ...props
}) => {
  const classNames = [
    'spinner',
    `spinner--${size}`,
    `spinner--${color}`,
    variant === 'hexagon' && 'spinner--hexagon',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const textClassNames = ['spinner__text', dots && 'spinner__text--dots']
    .filter(Boolean)
    .join(' ')

  const spinner = (
    <div className={classNames} {...props}>
      <div className='spinner__wrapper'>
        <div className='spinner__glow'></div>
        <div className='spinner__circle'></div>
        <div className='spinner__inner-circle'></div>
      </div>
      {text && <p className={textClassNames}>{text}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className='spinner__fullscreen'>{spinner}</div>
  }

  return spinner
}

export default Spinner
