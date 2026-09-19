"""Two-parameter logistic IRT calibration by marginal maximum likelihood.

Fits, for every item, a discrimination ``a`` and a difficulty ``b`` from a
persons x items matrix of right/wrong responses (``nan`` where a person did
not meet the item). Pseudo-guessing ``c`` is held fixed per item (the
multiple-choice chance level, 0 for everything else) rather than estimated:
with the response counts a learning product accumulates, a free ``c`` is the
parameter that runs away first.

EM with a fixed quadrature over ability:

  E-step  for each person, the posterior over the ability grid given their
          responses and a standard-normal prior;
  M-step  for each item, a few Newton steps on the expected complete-data
          log-likelihood of ``(a, b)`` under those posteriors.

Pure numpy. Small enough to read in one sitting, which matters more here
than the last decimal of a fit that is re-run every week.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

GRID = np.linspace(-4.0, 4.0, 41)
PRIOR = np.exp(-0.5 * GRID**2)
PRIOR /= PRIOR.sum()

A_BOUNDS = (0.3, 3.0)
B_BOUNDS = (-3.0, 3.0)


@dataclass
class FitResult:
    a: np.ndarray
    b: np.ndarray
    c: np.ndarray
    n_responses: np.ndarray
    iterations: int
    log_likelihood: float
    converged: bool


def _prob(theta: np.ndarray, a: float, b: float, c: float) -> np.ndarray:
    return c + (1.0 - c) / (1.0 + np.exp(-a * (theta - b)))


def fit_2pl(
    responses: np.ndarray,
    guessing: np.ndarray,
    max_iter: int = 60,
    tol: float = 1e-4,
    a_init: np.ndarray | None = None,
    b_init: np.ndarray | None = None,
) -> FitResult:
    """``responses`` is persons x items with 1/0/nan; ``guessing`` is per item."""
    persons, items = responses.shape
    observed = ~np.isnan(responses)
    u = np.where(observed, responses, 0.0)
    a = np.ones(items) if a_init is None else np.clip(a_init.astype(float), *A_BOUNDS)
    b = np.zeros(items) if b_init is None else np.clip(b_init.astype(float), *B_BOUNDS)
    c = np.clip(guessing.astype(float), 0.0, 0.5)

    last_ll = -np.inf
    converged = False
    iterations = 0
    for iterations in range(1, max_iter + 1):
        # --- E-step: posterior over the grid for every person -------------
        p = np.stack([_prob(GRID, a[j], b[j], c[j]) for j in range(items)], axis=1)  # grid x items
        p = np.clip(p, 1e-6, 1 - 1e-6)
        log_p = np.log(p)
        log_q = np.log(1.0 - p)
        # persons x grid: sum over observed items of u*log p + (1-u)*log q
        ll_pg = (u * observed) @ log_p.T + ((1.0 - u) * observed) @ log_q.T
        ll_pg += np.log(PRIOR)[None, :]
        m = ll_pg.max(axis=1, keepdims=True)
        post = np.exp(ll_pg - m)
        marginal = post.sum(axis=1, keepdims=True)
        post /= marginal
        ll = float((m.squeeze() + np.log(marginal.squeeze())).sum())

        # Expected counts per item per grid node: tried r_k and right n_k.
        n_k = observed.T.astype(float) @ post  # items x grid
        r_k = (u * observed).T @ post  # items x grid

        # --- M-step: Newton on (a, b) per item -----------------------------
        for j in range(items):
            aj, bj, cj = a[j], b[j], c[j]
            for _ in range(5):
                pj = _prob(GRID, aj, bj, cj)
                pj = np.clip(pj, 1e-6, 1 - 1e-6)
                # derivative of P wrt logit part
                lj = 1.0 / (1.0 + np.exp(-aj * (GRID - bj)))
                dP_dz = (1.0 - cj) * lj * (1.0 - lj)
                w = (r_k[j] - n_k[j] * pj) / (pj * (1.0 - pj))
                g_a = float(np.sum(w * dP_dz * (GRID - bj)))
                g_b = float(np.sum(w * dP_dz * (-aj)))
                # Expected (Fisher) information for the Hessian, kept simple.
                info = n_k[j] * dP_dz**2 / (pj * (1.0 - pj))
                h_aa = float(np.sum(info * (GRID - bj) ** 2)) + 1e-6
                h_bb = float(np.sum(info * aj**2)) + 1e-6
                h_ab = float(np.sum(info * (GRID - bj) * (-aj)))
                det = h_aa * h_bb - h_ab**2
                if det <= 1e-9:
                    break
                da = (h_bb * g_a - h_ab * g_b) / det
                db = (h_aa * g_b - h_ab * g_a) / det
                aj = float(np.clip(aj + da, *A_BOUNDS))
                bj = float(np.clip(bj + db, *B_BOUNDS))
                if abs(da) < 1e-5 and abs(db) < 1e-5:
                    break
            a[j], b[j] = aj, bj

        if abs(ll - last_ll) < tol * max(1.0, abs(ll)):
            converged = True
            break
        last_ll = ll

    return FitResult(
        a=a,
        b=b,
        c=c,
        n_responses=observed.sum(axis=0),
        iterations=iterations,
        log_likelihood=float(last_ll if not converged else ll),
        converged=converged,
    )
