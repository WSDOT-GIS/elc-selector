using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Proxy
{
	/// <summary>
	/// Converts from a number (a date returned from ArcGIS REST API) to a <see cref="DateTime"/>.
	/// </summary>
	public class IntToDateConverter: JsonConverter
	{
		/// <summary>
		/// Returns false.
		/// </summary>
		public override bool CanWrite { get { return false; } }

		/// <summary>
		/// Returns true if <paramref name="objectType"/> is <see cref="DateTime"/> type.
		/// </summary>
		/// <param name="objectType">Type of object.</param>
		/// <returns></returns>
		public override bool CanConvert(Type objectType)
		{
			return objectType == typeof(DateTime);
		}

		/// <summary>
		/// Reads a date integer from JSON into a date object.
		/// </summary>
		/// <param name="reader"></param>
		/// <param name="objectType"></param>
		/// <param name="existingValue"></param>
		/// <param name="serializer"></param>
		/// <returns></returns>
		public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
		{
			if (reader.TokenType == JsonToken.Integer)
			{
				double val = Convert.ToDouble(reader.Value);
				DateTime output = new DateTime(1970, 1, 1).AddMilliseconds(val);
				return output;
			}
			else
			{
				throw new NotSupportedException("Only a token type of JsonToken.Integer is supported.");
			}
		}

		/// <summary>
		/// This method is not implemented for this class.
		/// </summary>
		/// <param name="writer"></param>
		/// <param name="value"></param>
		/// <param name="serializer"></param>
		/// <exception cref="NotImplementedException">Thrown if this method is called.</exception>
		public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
		{
			throw new NotImplementedException();
		}
	}
}