import CustomDimensions from "./CustomDimensions";
import CustomMetrics from "./CustomMetrics";
import EnhancedEcommerce from "./EnhancedEcommerce";
import Event from "./hits/Event";
import Exception from "./hits/Exception";
import Item from "./hits/Item";
import PageView from "./hits/PageView";
import ScreenView from "./hits/ScreenView";
import Social from "./hits/Social";
import Timing from "./hits/Timing";
import Transaction from "./hits/Transaction";
import queryString from "query-string";

export default class Analytics {
  constructor(trackingId, clientId, version, userAgent, { idfa, adid }) {
    this.collectBaseEndpoint = "https://www.google-analytics.com/collect?";
    this.version = version || 1;
    this.trackingId = trackingId;
    this.clientId = clientId;
    this.userAgent = userAgent || null;
    this.customMetrics = new CustomMetrics();
    this.customDimensions = new CustomDimensions();
    this.EnhancedEcommerce = new EnhancedEcommerce();
    this.idfa = idfa;
    this.adid = adid;

    if (!userAgent) {
      throw new Error(
        "You must specify a user agent in order for Google Analytics to accept the event. Use DeviceInfo.getUserAgent() from react-native-device-info for this."
      );
    }
  }

  add(hit) {
    this.EnhancedEcommerce.add(hit);
  }

  addDimension(index, name) {
    this.customDimensions.addDimension(index, name);
  }

  removeDimension(index) {
    this.customDimensions.removeDimension(index);
  }

  addMetric(index, name) {
    this.customMetrics.addMetric(index, name);
  }

  removeMetric(index) {
    this.customMetrics.removeMetric(index);
  }

  send(hit) {
    if (
      !(hit instanceof Event) &&
      !(hit instanceof Exception) &&
      !(hit instanceof Item) &&
      !(hit instanceof PageView) &&
      !(hit instanceof ScreenView) &&
      !(hit instanceof Social) &&
      !(hit instanceof Timing) &&
      !(hit instanceof Transaction)
    ) {
      throw new Error(
        "Only the following hits can be sent using 'send' command: pageview, screenview, event, transaction, item, social, exception and timing"
      );
    }

    let request = this.collectBaseEndpoint;
    let params = {};
    let options = {
      method: "get",
      headers: {
        "User-Agent": this.userAgent,
      },
    };

    hit.set({
      v: this.version,
      tid: this.trackingId,
      cid: this.clientId,
    });

    // Adds hit to the request.
    params = { ...params, ...hit.properties };

    // Adds custom dimensions.
    if (Object.keys(this.customDimensions.properties).length) {
      params = { ...params, ...this.customDimensions.properties };
    }

    // Adds custom metrics.
    if (Object.keys(this.customMetrics.properties).length) {
      params = { ...params, ...this.customMetrics.properties };
    }

    // Adds 'enhanced ecommerce' hits to the request if the send hit is not of type 'ecommerce'.
    // Reference: https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
    if (
      !(hit instanceof Item) &&
      !(hit instanceof Transaction) &&
      !this.EnhancedEcommerce.isEmpty()
    ) {
      params = { ...params, ...this.EnhancedEcommerce.properties };
    }

    params = {
      ...params,
      z: Math.round(Math.random() * 1e8),
      ua: this.userAgent,
      ds: "app",
      ate: 1,
    };

    if (this.idfa) {
      params.idfa = this.idfa;
    }

    if (this.adid) {
      params.adid = this.adid;
    }

    const url = `${request}${queryString.stringify(params)}`;
    return fetch(url, options);
  }
}
