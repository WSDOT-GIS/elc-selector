/*
  This proxy page does not have any security checks. It is highly recommended
  that a user deploying this proxy page on their web server, add appropriate
  security checks, for example checking request path, username/password, target
  url, etc.
*/
using System;
using System.Web;
using System.Web.Caching;
using System.Xml.Serialization;

namespace Proxy
{
	[XmlRoot("ProxyConfig")]
	public class ProxyConfig
	{
		#region Static Members

		private static object _lockobject = new object();

		public static ProxyConfig LoadProxyConfig(string fileName)
		{
			ProxyConfig config = null;

			lock (_lockobject)
			{
				if (System.IO.File.Exists(fileName))
				{
					XmlSerializer reader = new XmlSerializer(typeof(ProxyConfig));
					using (System.IO.StreamReader file = new System.IO.StreamReader(fileName))
					{
						config = (ProxyConfig)reader.Deserialize(file);
					}
				}
			}

			return config;
		}

		public static ProxyConfig GetCurrentConfig()
		{
			ProxyConfig config = HttpRuntime.Cache["proxyConfig"] as ProxyConfig;
			if (config == null)
			{
				string fileName = GetFilename(HttpContext.Current);
				config = LoadProxyConfig(fileName);

				if (config != null)
				{
					CacheDependency dep = new CacheDependency(fileName);
					HttpRuntime.Cache.Insert("proxyConfig", config, dep);
				}
			}

			return config;
		}

		public static string GetFilename(HttpContext context)
		{
			return context.Server.MapPath("~/proxy.config");
		}
		#endregion

		ServerUrl[] serverUrls;
		bool mustMatch;

		[XmlArray("serverUrls")]
		[XmlArrayItem("serverUrl")]
		public ServerUrl[] ServerUrls
		{
			get { return this.serverUrls; }
			set { this.serverUrls = value; }
		}

		[XmlAttribute("mustMatch")]
		public bool MustMatch
		{
			get { return mustMatch; }
			set { mustMatch = value; }
		}

		public string GetToken(string uri)
		{
			foreach (ServerUrl su in serverUrls)
			{
				if (su.MatchAll && uri.StartsWith(su.Url, StringComparison.InvariantCultureIgnoreCase))
				{
					return su.Token;
				}
				else
				{
					if (String.Compare(uri, su.Url, StringComparison.InvariantCultureIgnoreCase) == 0)
						return su.Token;
				}
			}

			if (mustMatch)
				throw new InvalidOperationException();

			return string.Empty;
		}
	}
}