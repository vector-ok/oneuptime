module.exports = {
    //Description: Retrieve payment intent.
    //Params:
    //Param 1: paymentIntent: Payment Intent
    //Returns: promise
    checkPaymentIntent: async function (paymentIntent) {
        try {
            var processedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
            return processedPaymentIntent;
        } catch (error) {
            ErrorService.log('paymentService.checkPaymentIntent', error);
            throw error;
        }
    },

    //Description: Create customer in stripe for  user.
    //Params:
    //Param 1: stripeToken: Token generated from frontend
    //Param 2: user: User details
    //Returns: promise
    createCustomer: async function (email, companyName) {

        try {
            var customer = await stripe.customers.create({
                email: email,
                description: companyName
            });
            return customer.id;
        } catch (error) {
            ErrorService.log('paymentService.createCustomer', error);
            throw error;
        }
    },

    // eslint-disable-next-line no-unused-vars
    addPayment: async function (customerId, stripeToken) {
        try {
            var card = await stripe.customers.createSource(
                customerId,
            );
            return card;
        } catch (error) {
            ErrorService.log('paymentService.addPayment', error);
            throw error;
        }
    },

    //Description: Subscribe plan to user.
    //Params:
    //Param 1: stripePlanId: Id generated from frontend.
    //Param 2: stripeCustomerId: Stripe customer id.
    //Returns : promise
    subscribePlan: async function (stripePlanId, stripeCustomerId, coupon) {
        try {
            var items = [];
            items.push({
                plan: stripePlanId,
                quantity: 1
            });
    
            var subscriptionObj = {};
    
            if (coupon) {
                subscriptionObj = { customer: stripeCustomerId, items: items, coupon: coupon, trial_period_days: 14 };
            }
    
            else {
                subscriptionObj = { customer: stripeCustomerId, items: items, trial_period_days: 14 };
            }
            var subscription = await stripe.subscriptions.create(subscriptionObj);
            return ({
                stripeSubscriptionId: subscription.id,
            });
        } catch (error) {
            ErrorService.log('paymentService.subscribePlan', error);
            throw error;
        }
    },

    //Description: Call this fuction when you add and remove a team member from Fyipe. This would add and remove seats based on how many users are in the project.
    //Params:
    //Param 1: stripePlanId: Id generated from frontend.
    //Param 2: stripeCustomerId: Stripe customer id.
    //Returns : promise
    changeSeats: async function (subscriptionId, seats) {
        try {
            var subscription = await stripe.subscriptions.retrieve(subscriptionId);

            var plan = null;
            var items = [];
            if (!subscription || !subscription.items || !subscription.items.data || !subscription.items.data.length > 0) {
                let error = new Error('Your subscription cannot be retrieved.');
                error.code = 400;
                ErrorService.log('paymentService.changeSeats', error);
                throw error;
            } else {
                for (var i = 0; i < subscription.items.data.length; i++) {
                    plan = await Plans.getPlanById(subscription.items.data[i].plan.id);

                    if (plan) {
                        var item = {
                            plan: plan.planId,
                            id: subscription.items.data[i].id,
                            quantity: seats
                        };
    
                        items.push(item);
                    }
                }
                subscription = await stripe.subscriptions.update(subscriptionId, { items: items });

                return(subscription.id);
            }
        } catch (error) {
            ErrorService.log('paymentService.changeSeats', error);
            throw error;
        }
    },

    removeSubscription: async function (stripeSubscriptionId) {
        try {
            var confirmations = [];
            confirmations[0] = await stripe.subscriptions.del(stripeSubscriptionId);
            return confirmations;
        } catch (error) {
            ErrorService.log('paymentService.removeSubscription', error);
            throw error;
        }
    },


    changePlan: async function (subscriptionId, planId, seats ,trialLeft) {
        try {
            var subscriptionObj = {};
            var subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await stripe.subscriptions.del(subscriptionId);

            var items = [];
            items.push({
                plan: planId,
                quantity: seats
            });
            if (trialLeft && trialLeft < 14) {
                trialLeft = 14 - trialLeft;
                subscriptionObj = { customer: subscription.customer, items: items,trial_period_days: trialLeft };
            }
            else {
                subscriptionObj = { customer: subscription.customer, items: items,};
            }
            var subscriptions = await stripe.subscriptions.create(subscriptionObj);
            return subscriptions.id;
        } catch (error) {
            ErrorService.log('paymentService.changePlan', error);
            throw error;
        }
    },
    chargeAlert: async function(userId, projectId, chargeAmount){
        try {
            var project = await ProjectService.findOneBy({
                _id: projectId
            });
            var { balance } = project;
            var { minimumBalance, rechargeToBalance } = project.alertOptions;
            if ( balance < minimumBalance ){
                var chargeForBalance = await StripeService.chargeCustomerForBalance(userId, rechargeToBalance, project.id);
                if (!(chargeForBalance.paid)){
                    //create notification
                    var message = 'Your balance has fallen below minimum balance set in Alerts option. Click here to authorize payment';
                    var meta = {
                        type: 'action',
                        client_secret: chargeForBalance.client_secret
                    };
                    await NotificationService.create(projectId, message, userId, null, meta);
                }
            }
            var balanceAfterAlertSent = balance - chargeAmount;
            var updatedProject = await ProjectModel.findByIdAndUpdate(
                projectId, {
                    $set: {
                        balance: balanceAfterAlertSent
                    }
                }, { new: true });
            return updatedProject;
        } catch (error) {
            ErrorService.log('paymentService.chargeAlert', error);
            throw error;
        }
    },

    //Description: Call this fuction to bill for extra users added to an account.
    //Params:
    //Param 1: stripeCustomerId: Received during signup process.
    //Returns : promise
    chargeExtraUser: async function (stripeCustomerId, extraUserPlanId, extraUsersToAdd) {
        try {
            var subscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [
                    {
                        plan: extraUserPlanId,
                        quantity: extraUsersToAdd
                    },
                ]
            });
            return subscription;
        } catch (error) {
            ErrorService.log('paymentService.chargeExtraUser', error);
            throw error;
        }
    }
};

var payment = require('../config/payment');
var stripe = require('stripe')(payment.paymentPrivateKey);
var Plans = require('../config/plans');
var ErrorService = require('./errorService');
var ProjectService = require('./projectService');
var ProjectModel = require('../models/project');
var StripeService = require('./stripeService');
var NotificationService = require('./notificationService');
