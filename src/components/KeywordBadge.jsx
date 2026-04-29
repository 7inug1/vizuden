import Tooltip from './Tooltip';
import { keywordTooltips } from '../data/keywordTooltips';

export default function KeywordBadge({ keyword }) {
  const desc = keywordTooltips[keyword] ?? '';

  return (
    <Tooltip content={{ title: keyword, desc }} position="top">
      <span
        data-keyword-box
        className="inline-block px-3 py-1 border border-stone-300 text-sm text-stone-700
          hover:border-stone-700 hover:text-stone-900 cursor-default
          transition-colors duration-150"
      >
        {keyword}
      </span>
    </Tooltip>
  );
}
