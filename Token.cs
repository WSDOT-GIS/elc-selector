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
		[JsonProperty(PropertyName="expires")]
		public DateTime expires { get; set; }

		/// <summary>
		/// If this value is true then all requests requiring a token must occur over SSL. 
		/// If false then non-SSL requests are allowed.
		/// </summary>
		public bool ssl { get; set; }
	}

	/// <summary>
	/// Represents an OAuth token.
	/// </summary>
	public class OAuthToken
	{
		protected int _secondsUntilExpiration;

		/// <summary>
		/// The token string that will be provided to HTTP requests to the ArcGIS REST API for secure services.
		/// </summary>
		[JsonProperty(PropertyName="access_token")]
		public string AccessToken { get; set; }

		/// <summary>
		/// Number of seconds from token creation time until the token expires.
		/// </summary>
		[JsonProperty("expires_in")]
		public int SecondsUntilExpiration
		{
			get
			{
				return _secondsUntilExpiration;
			}
			set
			{
				CreationTime = DateTime.Now;
				_secondsUntilExpiration = value;
				Expires = CreationTime.AddSeconds(_secondsUntilExpiration);
			}
		}

		/// <summary>
		/// The date/time that this token expires
		/// </summary>
		[JsonIgnore]
		public DateTime Expires { get; protected set; }

		/// <summary>
		/// The date/time that the token was created.
		/// </summary>
		[JsonIgnore]
		public DateTime CreationTime { get; protected set; }
	}
}