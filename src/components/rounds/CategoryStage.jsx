import ChatStage from "./ChatStage.jsx";
import EitherOrStage from "./EitherOrStage.jsx";
import HeatmapStage from "./HeatmapStage.jsx";
import ListStage from "./ListStage.jsx";
import NumberStage from "./NumberStage.jsx";
import SongStage from "./SongStage.jsx";

export default function CategoryStage({
  category,
  item,
  roundState,
  progress,
  teams,
  onReveal,
  onPreviousItem,
  onNextItem,
  onResetRound,
  onUpdateProgress,
  onAwardPoints,
  isFirstItem,
  isLastItem,
  revealDisabled,
  revealLabel,
}) {
  if (!category || !item) {
    return null;
  }

  switch (category.type) {
    case "song":
      return (
        <SongStage
          item={item}
          revealed={roundState.revealed}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
          revealLabel={revealLabel}
        />
      );
    case "chat":
      return (
        <ChatStage
          item={item}
          roundState={roundState}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
          revealLabel={revealLabel}
        />
      );
    case "list":
      return (
        <ListStage
          item={item}
          revealed={roundState.revealed}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
          revealLabel={revealLabel}
        />
      );
    case "eitherOr":
      return (
        <EitherOrStage
          item={item}
          revealed={roundState.revealed}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
        />
      );
    case "heatmap":
      return (
        <HeatmapStage
          item={item}
          revealed={roundState.revealed}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
        />
      );
    case "number":
      return (
        <NumberStage
          item={item}
          revealed={roundState.revealed}
          progress={progress}
          teams={teams}
          onReveal={onReveal}
          onUpdateProgress={onUpdateProgress}
          onAwardPoints={onAwardPoints}
          onPreviousItem={onPreviousItem}
          onNextItem={onNextItem}
          onResetRound={onResetRound}
          isFirstItem={isFirstItem}
          isLastItem={isLastItem}
          revealDisabled={revealDisabled}
          revealLabel={revealLabel}
        />
      );
    default:
      return null;
  }
}
