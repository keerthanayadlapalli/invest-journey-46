<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep recommendation and comparison rules in the pure flow module, traceable to the supplied decision-logic document, so category selection and explanations share one source.
- Keep the original six-question state-driven journey; experience is collected but not used to rank categories because the supplied logic does not define that input.
- Route questionnaire navigation through navigateState so revisited questions clear their own and later answers and incomplete questionnaires cannot reach personalized results.
- Keep transactions simulated in existing browser state; category-specific details remain separate from recommendation logic so no external trades are implied by implementation.
