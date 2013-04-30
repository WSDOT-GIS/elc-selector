/*
  This proxy page does not have any security checks. It is highly recommended
  that a user deploying this proxy page on their web server, add appropriate
  security checks, for example checking request path, username/password, target
  url, etc.
*/
using System.Xml.Serialization;

namespace Proxy
{
	/// <summary>
	/// Represents a Server URL setting from the proxy.config file.
	/// </summary>
	public class ServerUrl
	{
		/// <summary>
		/// The URL
		/// </summary>
		[XmlAttribute("url")]
		public string Url { get; set; }

		/// <summary>
		/// <see langword="true"/> if the the proxy will match any URL that starts with 
		/// <see cref="ServerUrl.Url"/>, <see langword="false"/> otherwise.
		/// </summary>
		[XmlAttribute("matchAll")]
		public bool MatchAll { get; set; }

		/// <summary>
		/// The token for this URL.
		/// </summary>
		[XmlAttribute("token")]
		public string Token { get; set; }

		[XmlAttribute("dynamicToken")]
		public bool DynamicToken { get; set; }
	}

}