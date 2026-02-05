import { DisplayModeStep } from './DisplayModeStep';
import { DesignerSetupStep } from './DesignerSetupStep';
import { BusinessHoursStep } from './BusinessHoursStep';
import { CompletionStep } from './CompletionStep';
import type { OnboardingStep } from '../../hooks/useOnboarding';

interface OnboardingFlowProps {
  currentStep: OnboardingStep;
  onNextStep: () => void;
  onGoToStep: (step: OnboardingStep) => void;
  onComplete: () => void;
  onNavigateToBusinessHours: () => void;
}

export function OnboardingFlow({
  currentStep,
  onNextStep,
  onGoToStep,
  onComplete,
  onNavigateToBusinessHours,
}: OnboardingFlowProps) {
  switch (currentStep) {
    case 'display':
      return <DisplayModeStep onNext={onNextStep} />;

    case 'designer':
      return (
        <DesignerSetupStep
          onNext={onNextStep}
          onSkip={() => onGoToStep('hours')}
        />
      );

    case 'hours':
      return (
        <BusinessHoursStep
          onSetupNow={() => {
            onComplete();
            onNavigateToBusinessHours();
          }}
          onSkip={() => onGoToStep('complete')}
        />
      );

    case 'complete':
      return <CompletionStep onStart={onComplete} />;

    default:
      return null;
  }
}
