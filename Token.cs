using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Proxy
{
	public class Token
	{
		public string token { get; set; }
		public DateTime expires { get; set; }
		public bool ssl { get; set; }
	}
}