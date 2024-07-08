import React from 'react';
import './time.scss';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Props {
  datetime: string;
}

const RelativeTime: React.FC<Props> = ({ datetime }) => {
  const relativeTime = () => {
    const date = parseISO(datetime);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return <span id='relative-time-text'>{relativeTime()}</span>;
};

export default RelativeTime;