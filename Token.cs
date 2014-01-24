using System;
using Newtonsoft.Json;

namespace Proxy
{
	/// <summary>
	/// Represents the response for a request for a token from ArcGIS online.
	/// </summary>
	public class Token
	{
		/// <summary>
		/// The token.
		/// </summary>
		public string token { get; set; }

		/// <summary>
		/// The expiration date / time of the token.
		/// </summary>
		public DateTime expires { get; set; }

		/// <summary>
		/// If this value is true then all requests requiring a token must occur over SSL. 
		/// If false then non-SSL requests are allowed.
		/// </summary>
		public bool ssl { get; set; }
	}

	public class OAuthToken
	{
		[JsonProperty(PropertyName="access_token")]
		public string access_token { get; set; }
		[JsonProperty("expires_in")]
		public int expires_in { get; set; }
	}
}