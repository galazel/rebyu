package com.capstone.rebyu.adaptive.engine;

public final class BktModel {

    private BktModel() {
    }

    public record Params(double prior, double learn, double guess, double slip) {
        public Params {
            prior = IrtModel.clamp(prior, 0.01, 0.99);
            learn = IrtModel.clamp(learn, 0.001, 0.9);
            guess = IrtModel.clamp(guess, 0.01, 0.49);
            slip = IrtModel.clamp(slip, 0.01, 0.49);
        }
    }

    public static double update(double pKnown, boolean correct, Params params) {
        double p = IrtModel.clamp(pKnown, 1e-6, 1 - 1e-6);
        double posterior;
        if (correct) {
            double num = p * (1.0 - params.slip());
            posterior = num / (num + (1.0 - p) * params.guess());
        } else {
            double num = p * params.slip();
            posterior = num / (num + (1.0 - p) * (1.0 - params.guess()));
        }
        return posterior + (1.0 - posterior) * params.learn();
    }

    public static double predictCorrect(double pKnown, Params params) {
        return pKnown * (1.0 - params.slip()) + (1.0 - pKnown) * params.guess();
    }
}
